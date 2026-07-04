using System;
using System.Configuration;
using System.Diagnostics;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace DraftTool.WinForms
{
    public partial class MainForm : Form
    {
        private WebViewForm webViewForm;
        private TextBox txtConnectionString;
        private Button btnConnect;
        private Button btnBrowse;
        private Button btnSearch;
        private ListBox lstDatabases;
        private Label lblStatus;

        public MainForm()
        {
            InitializeComponent();
            Load += MainForm_Load;
        }

        private void InitializeComponent()
        {
            this.txtConnectionString = new TextBox();
            this.btnConnect = new Button();
            this.btnBrowse = new Button();
            this.btnSearch = new Button();
            this.lstDatabases = new ListBox();
            this.lblStatus = new Label();

            this.SuspendLayout();

            // txtConnectionString
            this.txtConnectionString.Location = new System.Drawing.Point(12, 20);
            this.txtConnectionString.Name = "txtConnectionString";
            this.txtConnectionString.Size = new System.Drawing.Size(350, 20);
            this.txtConnectionString.TabIndex = 0;
            this.txtConnectionString.Text = "Host=localhost;Port=5432;Username=postgres;Password=;Database=postgres";

            // btnConnect
            this.btnConnect.Location = new System.Drawing.Point(12, 110);
            this.btnConnect.Name = "btnConnect";
            this.btnConnect.Size = new System.Drawing.Size(100, 30);
            this.btnConnect.TabIndex = 1;
            this.btnConnect.Text = "Подключиться";
            this.btnConnect.UseVisualStyleBackColor = true;
            this.btnConnect.Click += BtnConnect_Click;

            // btnBrowse
            this.btnBrowse.Location = new System.Drawing.Point(368, 17);
            this.btnBrowse.Name = "btnBrowse";
            this.btnBrowse.Size = new System.Drawing.Size(40, 25);
            this.btnBrowse.TabIndex = 2;
            this.btnBrowse.Text = "...";
            this.btnBrowse.UseVisualStyleBackColor = true;
            this.btnBrowse.Click += BtnBrowse_Click;

            // btnSearch
            this.btnSearch.Location = new System.Drawing.Point(414, 17);
            this.btnSearch.Name = "btnSearch";
            this.btnSearch.Size = new System.Drawing.Size(100, 25);
            this.btnSearch.TabIndex = 3;
            this.btnSearch.Text = "🔍 Найти БД";
            this.btnSearch.UseVisualStyleBackColor = true;
            this.btnSearch.Click += BtnSearch_Click;

            // lstDatabases
            this.lstDatabases.FormattingEnabled = true;
            this.lstDatabases.Location = new System.Drawing.Point(12, 50);
            this.lstDatabases.Name = "lstDatabases";
            this.lstDatabases.Size = new System.Drawing.Size(502, 56);
            this.lstDatabases.TabIndex = 4;
            this.lstDatabases.DoubleClick += LstDatabases_DoubleClick;

            // lblStatus
            this.lblStatus.AutoSize = true;
            this.lblStatus.Location = new System.Drawing.Point(12, 115);
            this.lblStatus.Name = "lblStatus";
            this.lblStatus.Size = new System.Drawing.Size(0);
            this.lblStatus.TabIndex = 5;

            // MainForm
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(530, 150);
            this.Controls.Add(this.lstDatabases);
            this.Controls.Add(this.btnSearch);
            this.Controls.Add(this.btnBrowse);
            this.Controls.Add(this.btnConnect);
            this.Controls.Add(this.txtConnectionString);
            this.Name = "MainForm";
            this.Text = "Draft Tool - Подключение к БД";
            this.ResumeLayout(false);
            this.PerformLayout();
        }

        private void MainForm_Load(object sender, EventArgs e)
        {
            // Загрузка сохраненной строки подключения
            string savedConnection = ConfigurationManager.AppSettings["ConnectionString"];
            if (!string.IsNullOrEmpty(savedConnection))
            {
                txtConnectionString.Text = savedConnection;
            }
        }

        private async void BtnConnect_Click(object sender, EventArgs e)
        {
            string connectionString = txtConnectionString.Text.Trim();
            
            if (string.IsNullOrEmpty(connectionString))
            {
                lblStatus.Text = "Введите строку подключения";
                lblStatus.ForeColor = System.Drawing.Color.Red;
                return;
            }

            try
            {
                lblStatus.Text = "Проверка подключения...";
                lblStatus.ForeColor = System.Drawing.Color.Orange;

                // Проверка подключения через API бэкенда
                using (var httpClient = new System.Net.Http.HttpClient())
                {
                    // Сохранение строки подключения
                    var config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
                    config.AppSettings.Settings["ConnectionString"].Value = connectionString;
                    config.Save(ConfigurationSaveMode.Modified);
                    ConfigurationManager.RefreshSection("appSettings");

                    lblStatus.Text = "Запуск бэкенда...";
                    lblStatus.ForeColor = System.Drawing.Color.Blue;

                    // Запуск бэкенда
                    StartBackend();

                    // Ожидание запуска бэкенда
                    await Task.Delay(2000);

                    // Проверка здоровья бэкенда
                    var health = await httpClient.GetAsync("http://localhost:3001/api/health");
                    if (health.IsSuccessStatusCode)
                    {
                        lblStatus.Text = "Подключение успешно!";
                        lblStatus.ForeColor = System.Drawing.Color.Green;

                        // Открытие WebView
                        OpenWebView();
                    }
                    else
                    {
                        lblStatus.Text = "Ошибка: бэкенд не отвечает";
                        lblStatus.ForeColor = System.Drawing.Color.Red;
                    }
                }
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"Ошибка: {ex.Message}";
                lblStatus.ForeColor = System.Drawing.Color.Red;
            }
        }

        private void BtnBrowse_Click(object sender, EventArgs e)
        {
            using (var openFileDialog = new OpenFileDialog())
            {
                openFileDialog.Filter = "Config files|*.conf|All files|*.*";
                if (openFileDialog.ShowDialog() == DialogResult.OK)
                {
                    txtConnectionString.Text = openFileDialog.FileName;
                }
            }
        }

        private async void BtnSearch_Click(object sender, EventArgs e)
        {
            lstDatabases.Items.Clear();
            lblStatus.Text = "Поиск PostgreSQL на компьютере...";
            lblStatus.ForeColor = System.Drawing.Color.Orange;

            try
            {
                // Поиск PostgreSQL через netstat и системные настройки
                var foundDatabases = await SearchLocalPostgreSQL();
                
                if (foundDatabases.Count > 0)
                {
                    lstDatabases.Items.AddRange(foundDatabases.ToArray());
                    lblStatus.Text = $"Найдено {foundDatabases.Count} баз(ы)";
                    lblStatus.ForeColor = System.Drawing.Color.Green;
                }
                else
                {
                    lstDatabases.Items.Add("Базы не найдены. Введите параметры подключения вручную.");
                    lblStatus.Text = "Базы не найдены";
                    lblStatus.ForeColor = System.Drawing.Color.Red;
                }
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"Ошибка поиска: {ex.Message}";
                lblStatus.ForeColor = System.Drawing.Color.Red;
            }
        }

        private async Task<List<string>> SearchLocalPostgreSQL()
        {
            var databases = new List<string>();
            
            // Стандартные базы PostgreSQL
            string[] defaultDatabases = { "postgres", "template1" };
            
            // Проверяем стандартное подключение
            foreach (var db in defaultDatabases)
            {
                var connectionString = $"Host=localhost;Port=5432;Username=postgres;Password=;Database={db}";
                try
                {
                    using (var conn = new Npgsql.NpgsqlConnection(connectionString))
                    {
                        await conn.OpenAsync();
                        databases.Add($"{db} (localhost:5432)");
                    }
                }
                catch
                {
                    // База недоступна или не существует
                }
            }

            // Поиск через netstat (если порт 5432 открыт)
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "netstat",
                        Arguments = "-ano",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                process.Start();
                string output = await process.StandardOutput.ReadToEndAsync();
                process.WaitForExit();

                if (output.Contains(":5432"))
                {
                    databases.Add("PostgreSQL (обнаружен по порту 5432)");
                }
            }
            catch
            {
                // Игнорируем ошибки netstat
            }

            return databases;
        }

        private void LstDatabases_DoubleClick(object sender, EventArgs e)
        {
            if (lstDatabases.SelectedItem != null)
            {
                string selected = lstDatabases.SelectedItem.ToString();
                // Извлекаем имя базы из строки
                string dbName = selected.Split(' ')[0];
                txtConnectionString.Text = $"Host=localhost;Port=5432;Username=postgres;Password=;Database={dbName}";
            }
        }

        private void StartBackend()
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = "src/app.js",
                WorkingDirectory = Path.Combine(Application.StartupPath, "..", "..", "..", "..", "backend"),
                UseShellExecute = false,
                CreateNoWindow = true
            };

            Process.Start(startInfo);
        }

        private void OpenWebView()
        {
            webViewForm = new WebViewForm("http://localhost:3000");
            webViewForm.Show();
        }
    }
}
